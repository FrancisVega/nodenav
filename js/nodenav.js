
$(document).ready(function() {

    /*
        UTILS
    */

    // Requires
    var platform = require("os").platform;
    var child_process = require('child_process');
    var fs = require('fs');
    var path = require('path');
    var sizeOf = require('image-size');

    // Platform convert app
    switch (platform()) {
        case "darwin":
            CONVERT = "vendor/win/convert.exe";
            break;
        case "win32":
            CONVERT = "vendor/win/convert.exe";
    }

    // Get file extension .ext
    function getExtension(filename) {
        var i = filename.lastIndexOf('.');
        return (i < 0) ? '' : filename.substr(i);
    }

    // Filter file list array by extension
    function filter_by_extension(file_list, extension) {
        var len = file_list.length;
        var temp_list = [];
        for(var i=0;i<len;i++) {
            if(getExtension(file_list[i]) == extension) {
                temp_list.push(file_list[i]);
            }
        }
        return temp_list;
    }

    // Get file list with ext
    function get_file_list(path, ext, full_path) {
        var files = fs.readdirSync(path);
        var filter_files = filter_by_extension(files, "."+ext);

        if(full_path) {
            var files_length = filter_files.length;
            for(var i=0;i<files_length;i++) {
                filter_files[i] = path + "/" + filter_files[i];
            }
        }

        return filter_files;
    }


    // load templates
    function load_template(path) {
        var template = fs.readFileSync(path, 'utf8');
        return template;
    }

    // shift array element
    function shift(array, n) {
        len = array.length;
        n = n % len
        head = array.slice(n, len)
        tail = array.slice(0, n)
        return head.concat(tail)
    }


    /*
        INPUT TEXT
    */

    // Enable button when type a title
    $("#pynav-title").on('keyup blur', function() {
        // $('#submit-button').prop('disabled', this.value.trim().length);
        if(this.value.trim()) {
            $('#submit-button').removeClass('disabled');
            $('#submit-button').prop('disabled', 0);
        } else {
            $('#submit-button').addClass('disabled');
            $('#submit-button').prop('disabled', 1);
        }
    });


    /*
        SUBMIT
    */


    // Submit
    $( ".create" ).click(function() {

        /*
            DATA
        */

        // Title and Paths
        var pynav_title = $("#pynav-title").val();
        var pynav_src = $("#pynav-src").val();
        var pynav_dst = $("#pynav-dst").val();

        // File formats
        var pynav_src_format = $('input[name=input-format]:checked').val();
        var pynav_dst_format = $('input[name=output-format]:checked').val();

        // Options
        var pynav_mobile = $('input[name=mobile]:checked').val();
        var pynav_index = $('input[name=index]:checked').val();
        var pynav_overwrite = $('input[name=overwrite]:checked').val();


        /*
            DST DIRECTORY
        */

        try {
            fs.mkdirSync(pynav_dst)
        } catch(err) {
            console.log("Directory " + pynav_dst + " exists")
        }


        /*
            IMAGE
        */

        // Read JUST files and make src, dst and html full path files
        var src_files = get_file_list(pynav_src, pynav_src_format, full_path = false);
        var src_files_shifted = shift(src_files, 1);

        var files_to_convert = src_files.length;
        
        /*
            LIGHTBOX
        */
        // $(this).css('display', 'block');
        $('#processing').fadeIn('fast');
        $('#processing .dst').html(pynav_dst);



        for (var i=0;i<files_to_convert;i++) {
            
            /*
                SET PATHS
            */

            // Regexp pattern to grab .extension
            var re = new RegExp("\."+pynav_src_format+"$");

            // files
            var src_file = src_files[i]            
            var dst_file = src_files[i].replace(re, "."+pynav_dst_format);
            var htm_file = src_files[i].replace(re, ".html");
            var htm_tar_file = src_files_shifted[i].replace(re, ".html");

            // join files to path
            src_filepath = path.join(pynav_src, src_file);
            dst_filepath = path.join(pynav_dst, dst_file);
            htm_filepath = path.join(pynav_dst, htm_file);

            // source file dimension
            var dimensions = sizeOf(src_filepath);
            var img_width = dimensions.width;
            var img_height = dimensions.height;

            /*
                IMAGE CONVERT
            */
            // src == psd
            if(pynav_src_format=="psd") { src_filepath += "[0]"; }
            child_process.execFile(CONVERT, [src_filepath, '-quality', '100', dst_filepath], function(error, stdout, stderr){ console.log(stdout); });

            /*
                HTML
            */

            // Load correct template
            var tmpl;
            if(pynav_mobile) {
                tmpl = load_template('html/pynav-mobile.html');    
            } else {
                tmpl = load_template('html/pynav-desktop.html');
            }
            
            // replace pynav tags            
            tmpl = tmpl.replace(/\[pynav-title\]/, pynav_title)
            tmpl = tmpl.replace(/\[pynav-img\]/, dst_file)
            tmpl = tmpl.replace(/\[pynav-img-width\]/, img_width)
            tmpl = tmpl.replace(/\[pynav-img-height\]/, img_height)
            tmpl = tmpl.replace(/\[pynav-next-html\]/, htm_tar_file)
            // write html file
            fs.writeFile(htm_filepath, tmpl);
        }

        $( ".done" ).click(function() {
            $('#processing').fadeOut('fast', function() {
               $(this).css('display', 'none');
            })
        });

    });
});