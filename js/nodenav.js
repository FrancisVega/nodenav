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
            CONVERT = "vendor/osx/convert";
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
    $("#nodenav-title").on('keyup blur', function() {
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
        var nodenav_title = $("#nodenav-title").val();
        var nodenav_src = $("#nodenav-src").val();
        var nodenav_dst = $("#nodenav-dst").val();

        // File formats
        var nodenav_src_format = $('input[name=input-format]:checked').val();
        var nodenav_dst_format = $('input[name=output-format]:checked').val();

        // Options
        var nodenav_mobile = $('input[name=mobile]:checked').val();
        var nodenav_index = $('input[name=index]:checked').val();
        var nodenav_overwrite = $('input[name=overwrite]:checked').val();

        /*
            DST DIRECTORY
        */

        try {
            fs.mkdirSync(nodenav_dst)
        } catch(err) {
            console.log("Directory " + nodenav_dst + " exists")
        }

        /*
            IMAGE
        */

        var src_files = get_file_list(nodenav_src, nodenav_src_format, full_path = false);
        var src_files_shifted = shift(src_files, 1);
        var files_to_convert = src_files.length;

        /*
            LIGHTBOX
        */

        $('#processing').fadeIn('fast');
        $('#processing .dst').html(nodenav_dst);

        for (var i=0;i<files_to_convert;i++) {

            /*
                SET PATHS
            */

            // Regexp pattern to grab .extension
            var re = new RegExp("\."+nodenav_src_format+"$");

            // files
            var src_file = src_files[i]
            var dst_file = src_files[i].replace(re, "."+nodenav_dst_format);
            var htm_file = src_files[i].replace(re, ".html");
            var htm_tar_file = src_files_shifted[i].replace(re, ".html");

            // join files to path
            src_filepath = path.join(nodenav_src, src_file);
            dst_filepath = path.join(nodenav_dst, dst_file);
            htm_filepath = path.join(nodenav_dst, htm_file);

            // source file dimension
            var dimensions = sizeOf(src_filepath);
            var img_width = dimensions.width;
            var img_height = dimensions.height;

            /*
                IMAGE CONVERT
            */

            if(nodenav_src_format=="psd") { src_filepath += "[0]"; } // workaround to psd convert
            child_process.execFile(CONVERT, [src_filepath, '-quality', '100', dst_filepath], function(error, stdout, stderr){ console.log(stdout); });

            /*
                HTML TEMPLATES
            */

            // Navigation
            var nav_tmpl;            
            if(nodenav_mobile) {
                nav_tmpl = load_template('html/nodenav-mobile.html');
            } else {
                nav_tmpl = load_template('html/nodenav-desktop.html');
            }

            // replace nodenav tags
            nav_tmpl = nav_tmpl.replace(/\[nodenav-title\]/, nodenav_title)
            nav_tmpl = nav_tmpl.replace(/\[nodenav-img\]/, dst_file)
            nav_tmpl = nav_tmpl.replace(/\[nodenav-img-width\]/, img_width)
            nav_tmpl = nav_tmpl.replace(/\[nodenav-img-height\]/, img_height)
            nav_tmpl = nav_tmpl.replace(/\[nodenav-next-html\]/, htm_tar_file)
            // write html file
            fs.writeFile(htm_filepath, nav_tmpl);

            // Index
            var index_nav_tmpl;
            if (nodenav_index) {
                index_nav_tmpl = load_template('html/nodenav-index.html');
                index_nav_tmpl = index_nav_tmpl.replace(/\[nodenav-title\]/, nodenav_title);
                index_nav_tmpl = index_nav_tmpl.replace(/\[nodenav-page-link\]/, nodenav_li_link);
            }
            
        }

        $(".done").click(function() {
            $('#processing').fadeOut('fast', function() {
               $(this).css('display', 'none');
            });
        });

    });
});